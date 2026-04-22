package com.polyhub.service.impl;

import com.polyhub.entity.Group;
import com.polyhub.repository.jpa.GroupRepository;
import com.polyhub.service.GroupService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GroupServiceImpl implements GroupService {

    @Autowired
    private GroupRepository groupRepository;

    @Override
    public List<Group> getAllGroups() {
        return groupRepository.findAll();
    }

}
